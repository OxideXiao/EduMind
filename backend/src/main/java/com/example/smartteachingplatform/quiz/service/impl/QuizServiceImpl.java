package com.example.smartteachingplatform.quiz.service.impl;

import com.example.smartteachingplatform.agent.dto.TriggerReminderRequest;
import com.example.smartteachingplatform.agent.service.AgentService;
import com.example.smartteachingplatform.graph.entity.KnowledgeNode;
import com.example.smartteachingplatform.graph.mapper.KnowledgeNodeMapper;
import com.example.smartteachingplatform.quiz.dto.*;
import com.example.smartteachingplatform.quiz.entity.*;
import com.example.smartteachingplatform.quiz.mapper.QuestionMapper;
import com.example.smartteachingplatform.quiz.mapper.QuizMapper;
import com.example.smartteachingplatform.quiz.mapper.SubmissionMapper;
import com.example.smartteachingplatform.quiz.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuestionMapper questionMapper;
    private final QuizMapper quizMapper;
    private final SubmissionMapper submissionMapper;
    private final KnowledgeNodeMapper knowledgeNodeMapper;
    private final AgentService agentService;

    // ────────── 创建题目 ──────────

    @Override
    @Transactional
    public Long createQuestion(Long courseId, Long teacherId, QuestionCreateRequest request) {
        Question q = new Question();
        q.setCourseId(courseId);
        q.setKnowledgeNodeId(request.getNodeId());
        q.setQuestionType(mapQuestionType(request.getType()));
        q.setStem(request.getContent());
        q.setAnswer(request.getAnswer());
        q.setAnalysis(request.getAnalysis());
        q.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : 1);
        q.setCreatedBy(teacherId);
        questionMapper.insert(q);

        // 插入选项
        if (request.getOptions() != null) {
            for (QuestionCreateRequest.OptionItem opt : request.getOptions()) {
                QuestionOption o = new QuestionOption();
                o.setQuestionId(q.getId());
                o.setOptionLabel(opt.getLabel());
                o.setOptionContent(opt.getText());
                o.setIsCorrect(Boolean.TRUE.equals(opt.getIsCorrect()) ? 1 : 0);
                questionMapper.insertOption(o);
            }
        }
        log.info("题目创建成功: id={}, type={}", q.getId(), q.getQuestionType());
        return q.getId();
    }

    // ────────── 创建测验 ──────────

    @Override
    @Transactional
    public Long createQuiz(Long courseId, Long teacherId, QuizCreateRequest request) {
        Quiz quiz = new Quiz();
        quiz.setCourseId(courseId);
        quiz.setTitle(request.getName());
        quiz.setDescription(request.getDescription());
        quiz.setEndTime(request.getDeadline());
        quiz.setStatus("published");
        quiz.setCreatedBy(teacherId);

        BigDecimal perQuestion = BigDecimal.valueOf(10);
        quiz.setTotalScore(perQuestion.multiply(BigDecimal.valueOf(request.getQuestionIds().size())));
        quizMapper.insert(quiz);

        int order = 0;
        for (Long questionId : request.getQuestionIds()) {
            quizMapper.insertQuizQuestion(quiz.getId(), questionId, perQuestion, order++);
        }
        log.info("测验创建成功: id={}, questions={}", quiz.getId(), request.getQuestionIds().size());
        return quiz.getId();
    }

    // ────────── 获取测验详情（不含答案） ──────────

    @Override
    public QuizDetailResponse getQuizDetail(Long quizId) {
        Quiz quiz = quizMapper.findById(quizId);
        if (quiz == null) throw new RuntimeException("测验不存在");

        QuizDetailResponse resp = new QuizDetailResponse();
        resp.setQuizId(quiz.getId());
        resp.setName(quiz.getTitle());
        resp.setDescription(quiz.getDescription());
        resp.setTotalScore(quiz.getTotalScore());
        resp.setDeadline(quiz.getEndTime());

        List<Long> questionIds = quizMapper.findQuestionIdsByQuizId(quizId);
        List<QuizDetailResponse.QuestionItem> items = new ArrayList<>();
        for (Long qid : questionIds) {
            Question q = questionMapper.findById(qid);
            if (q == null) continue;

            QuizDetailResponse.QuestionItem item = new QuizDetailResponse.QuestionItem();
            item.setQuestionId(q.getId());
            item.setType(q.getQuestionType());
            item.setContent(q.getStem());
            BigDecimal score = quizMapper.findQuestionScore(quizId, qid);
            item.setScore(score != null ? score : BigDecimal.ZERO);

            // 选项不含 is_correct
            List<QuestionOption> options = questionMapper.findOptionsByQuestionId(qid);
            if (!options.isEmpty()) {
                item.setOptions(options.stream().map(o -> {
                    QuizDetailResponse.OptionItem oi = new QuizDetailResponse.OptionItem();
                    oi.setLabel(o.getOptionLabel());
                    oi.setText(o.getOptionContent());
                    return oi;
                }).collect(Collectors.toList()));
            }
            items.add(item);
        }
        resp.setQuestions(items);
        return resp;
    }

    // ────────── 提交测验 ──────────

    @Override
    @Transactional
    public SubmitResultResponse submitQuiz(Long quizId, Long studentId, SubmitRequest request) {
        Quiz quiz = quizMapper.findById(quizId);
        if (quiz == null) throw new RuntimeException("测验不存在");

        Map<String, String> studentAnswers = request.getAnswers();
        List<Long> questionIds = quizMapper.findQuestionIdsByQuizId(quizId);

        // 1. 逐题评分
        BigDecimal totalEarned = BigDecimal.ZERO;
        List<QuizAnswer> answers = new ArrayList<>();
        Map<Long, BigDecimal> nodeScores = new HashMap<>();     // nodeId → 总得分
        Map<Long, BigDecimal> nodeMaxScores = new HashMap<>();  // nodeId → 满分

        for (Long qid : questionIds) {
            Question q = questionMapper.findById(qid);
            if (q == null) continue;

            BigDecimal questionScore = quizMapper.findQuestionScore(quizId, qid);
            if (questionScore == null) questionScore = BigDecimal.ZERO;

            String studentAnswer = studentAnswers.getOrDefault(String.valueOf(qid), "");

            GradingResult grad = gradeQuestion(q, studentAnswer, questionScore);
            totalEarned = totalEarned.add(grad.earnedScore);

            QuizAnswer ans = new QuizAnswer();
            ans.setQuestionId(qid);
            ans.setStudentAnswer(studentAnswer);
            ans.setIsCorrect(grad.isCorrect ? 1 : 0);
            ans.setScore(grad.earnedScore);
            answers.add(ans);

            // 按知识点累计
            if (q.getKnowledgeNodeId() != null) {
                nodeScores.merge(q.getKnowledgeNodeId(), grad.earnedScore, BigDecimal::add);
                nodeMaxScores.merge(q.getKnowledgeNodeId(), questionScore, BigDecimal::add);
            }
        }

        // 2. 插入提交记录
        int attemptNo = submissionMapper.getMaxAttemptNo(quizId, studentId) + 1;
        BigDecimal correctRate = quiz.getTotalScore().compareTo(BigDecimal.ZERO) > 0
                ? totalEarned.divide(quiz.getTotalScore(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        QuizSubmission submission = new QuizSubmission();
        submission.setQuizId(quizId);
        submission.setStudentId(studentId);
        submission.setAttemptNo(attemptNo);
        submission.setTotalScore(totalEarned);
        submission.setCorrectRate(correctRate);
        submission.setStatus("submitted");
        submissionMapper.insertSubmission(submission);

        // 3. 插入答案
        for (QuizAnswer ans : answers) {
            ans.setSubmissionId(submission.getId());
            submissionMapper.insertAnswer(ans);
        }

        // 4. 更新掌握度
        List<SubmitResultResponse.MasteryUpdate> masteryUpdates = new ArrayList<>();
        boolean triggerReminder = false;

        for (Map.Entry<Long, BigDecimal> entry : nodeScores.entrySet()) {
            Long nodeId = entry.getKey();
            BigDecimal earned = entry.getValue();
            BigDecimal maxScore = nodeMaxScores.getOrDefault(nodeId, BigDecimal.ONE);
            BigDecimal nodeRate = maxScore.compareTo(BigDecimal.ZERO) > 0
                    ? earned.divide(maxScore, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            KnowledgeMastery oldMastery = submissionMapper.findMastery(quiz.getCourseId(), studentId, nodeId);
            BigDecimal oldScore = oldMastery != null ? oldMastery.getMasteryScore() : BigDecimal.ZERO;

            // 新分 × 0.6 + 旧分 × 0.4
            BigDecimal newScore = nodeRate.multiply(BigDecimal.valueOf(0.6))
                    .add(oldScore.multiply(BigDecimal.valueOf(0.4)))
                    .setScale(2, RoundingMode.HALF_UP);

            if (newScore.compareTo(BigDecimal.valueOf(100)) > 0) newScore = BigDecimal.valueOf(100);

            KnowledgeMastery mastery = new KnowledgeMastery();
            mastery.setCourseId(quiz.getCourseId());
            mastery.setStudentId(studentId);
            mastery.setKnowledgeNodeId(nodeId);
            mastery.setMasteryScore(newScore);
            mastery.setMasteryLevel(calcMasteryLevel(newScore));
            mastery.setLastQuizScore(nodeRate);
            submissionMapper.upsertMastery(mastery);

            // 写入历史
            Long masteryId = submissionMapper.findMastery(quiz.getCourseId(), studentId, nodeId).getId();
            submissionMapper.insertMasteryHistory(masteryId, quiz.getCourseId(), studentId, nodeId,
                    oldScore, newScore, "quiz_submit");

            // 写入学习日志
            submissionMapper.insertLearningLog(quiz.getCourseId(), studentId, nodeId, submission.getId());

            KnowledgeNode node = knowledgeNodeMapper.findById(nodeId);
            BigDecimal delta = newScore.subtract(oldScore);
            masteryUpdates.add(buildMasteryUpdate(nodeId, node, oldScore, newScore, delta));

            // delta ≤ -15 → 触发提醒
            if (delta.compareTo(BigDecimal.valueOf(-15)) <= 0) {
                triggerReminder = true;
                TriggerReminderRequest trigger = new TriggerReminderRequest();
                trigger.setStudentId(studentId);
                trigger.setReason("MASTERY_DROP");
                trigger.setContext(Map.of("nodeId", nodeId, "delta", delta.doubleValue()));
                try {
                    agentService.triggerReminder(quiz.getCourseId(), trigger);
                } catch (Exception e) {
                    log.warn("触发提醒失败: {}", e.getMessage());
                }
            }
        }

        SubmitResultResponse resp = new SubmitResultResponse();
        resp.setSubmissionId(submission.getId());
        resp.setScore(totalEarned);
        resp.setTotalScore(quiz.getTotalScore());
        resp.setMasteryUpdates(masteryUpdates);
        resp.setTriggerReminder(triggerReminder);

        log.info("测验提交成功: submissionId={}, score={}/{}", submission.getId(), totalEarned, quiz.getTotalScore());
        return resp;
    }

    // ────────── 评分逻辑 ──────────

    private GradingResult gradeQuestion(Question q, String studentAnswer, BigDecimal maxScore) {
        String correctAnswer = q.getAnswer();
        List<QuestionOption> options = questionMapper.findOptionsByQuestionId(q.getId());

        switch (q.getQuestionType()) {
            case "single":
            case "judge":
                return gradeByOptions(options, studentAnswer, maxScore);
            case "multiple":
                return gradeMultiple(options, studentAnswer, maxScore);
            case "blank":
                return gradeBlank(correctAnswer, studentAnswer, maxScore);
            case "short_answer":
            default:
                // 简答题不自动评分
                return new GradingResult(false, BigDecimal.ZERO);
        }
    }

    /** 单选题/判断题：匹配 is_correct=1 的选项（优先比内容，其次比标签） */
    private GradingResult gradeByOptions(List<QuestionOption> options, String studentAnswer, BigDecimal maxScore) {
        String correctContent = null;
        String correctLabel = null;
        for (QuestionOption o : options) {
            if (o.getIsCorrect() != null && o.getIsCorrect() == 1) {
                correctLabel = o.getOptionLabel();
                correctContent = o.getOptionContent();
                break;
            }
        }
        if (correctContent == null) correctContent = correctLabel != null ? correctLabel : "A";
        String ans = studentAnswer != null ? studentAnswer.trim() : "";
        // 优先匹配选项内容（前端发的是文本），再匹配标签
        boolean correct = correctContent.equals(ans)
                || (correctLabel != null && correctLabel.equalsIgnoreCase(ans));
        return new GradingResult(correct, correct ? maxScore : BigDecimal.ZERO);
    }

    /** 多选题：全部正确选项选中且无多余 */
    private GradingResult gradeMultiple(List<QuestionOption> options, String studentAnswer, BigDecimal maxScore) {
        Set<String> correctLabels = new HashSet<>();
        for (QuestionOption o : options) {
            if (o.getIsCorrect() != null && o.getIsCorrect() == 1) {
                correctLabels.add(o.getOptionLabel().toUpperCase());
            }
        }
        Set<String> studentLabels = Arrays.stream(studentAnswer.split("[,\\s]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .collect(Collectors.toSet());

        boolean correct = correctLabels.equals(studentLabels) && !correctLabels.isEmpty();
        return new GradingResult(correct, correct ? maxScore : BigDecimal.ZERO);
    }

    /** 填空题：去除空格后完全匹配 */
    private GradingResult gradeBlank(String correctAnswer, String studentAnswer, BigDecimal maxScore) {
        if (correctAnswer == null) correctAnswer = "";
        String s = studentAnswer != null ? studentAnswer.trim().replaceAll("\\s+", "") : "";
        String c = correctAnswer.trim().replaceAll("\\s+", "");
        boolean correct = c.equalsIgnoreCase(s);
        return new GradingResult(correct, correct ? maxScore : BigDecimal.ZERO);
    }

    // ────────── 工具方法 ──────────

    /** API 题型 → DB 题型 */
    private String mapQuestionType(String type) {
        if (type == null) return "single";
        return switch (type.toUpperCase()) {
            case "SINGLE_CHOICE" -> "single";
            case "MULTIPLE_CHOICE" -> "multiple";
            case "TRUE_FALSE" -> "judge";
            case "FILL_BLANK" -> "blank";
            case "SHORT_ANSWER" -> "short_answer";
            default -> type.toLowerCase();
        };
    }

    private String calcMasteryLevel(BigDecimal score) {
        int s = score.intValue();
        if (s == 0) return "gray";
        if (s < 60) return "red";
        if (s < 80) return "yellow";
        return "green";
    }

    private SubmitResultResponse.MasteryUpdate buildMasteryUpdate(Long nodeId, KnowledgeNode node,
                                                                   BigDecimal oldScore, BigDecimal newScore, BigDecimal delta) {
        SubmitResultResponse.MasteryUpdate mu = new SubmitResultResponse.MasteryUpdate();
        mu.setNodeId(nodeId);
        mu.setNodeName(node != null ? node.getNodeName() : "未知");
        mu.setOldScore(oldScore);
        mu.setNewScore(newScore);
        mu.setDelta(delta);
        return mu;
    }

    private static class GradingResult {
        boolean isCorrect;
        BigDecimal earnedScore;
        GradingResult(boolean isCorrect, BigDecimal earnedScore) {
            this.isCorrect = isCorrect; this.earnedScore = earnedScore;
        }
    }
}
