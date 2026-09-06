package com.example.smartteachingplatform.course.service.impl;

import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.entity.Course;
import com.example.smartteachingplatform.course.entity.CourseMember;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.course.mapper.CourseMemberMapper;
import com.example.smartteachingplatform.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseMapper courseMapper;
    private final CourseMemberMapper courseMemberMapper;

    @Override
    @Transactional
    public Map<String, Object> createCourse(Long teacherId, String name, String semester, String description) {
        Course course = new Course();
        course.setCourseName(name);
        course.setSemester(semester);
        course.setDescription(description);
        course.setTeacherId(teacherId);
        course.setInviteCode(generateInviteCode());
        courseMapper.insert(course);

        CourseMember member = new CourseMember();
        member.setCourseId(course.getId());
        member.setUserId(teacherId);
        member.setMemberRole("teacher");
        courseMemberMapper.insert(member);

        return Map.of(
                "courseId", course.getId(),
                "name", course.getCourseName(),
                "semester", course.getSemester(),
                "inviteCode", course.getInviteCode(),
                "teacherId", teacherId
        );
    }

    @Override
    public List<Map<String, Object>> listMyCourses(Long userId) {
        List<Course> courses = courseMapper.findMyCourses(userId);

        return courses.stream()
                .map(c -> {
                    String role = c.getRole() != null ? c.getRole().toUpperCase() : null;
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("courseId", c.getId());
                    m.put("name", c.getCourseName());
                    m.put("semester", c.getSemester() != null ? c.getSemester() : "");
                    m.put("role", role);
                    m.put("studentCount", c.getStudentCount() != null ? c.getStudentCount() : 0);
                    m.put("nodeCount", c.getNodeCount() != null ? c.getNodeCount() : 0);
                    if ("TEACHER".equals(role)) {
                        m.put("inviteCode", c.getInviteCode());
                    }
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> joinByInviteCode(Long userId, String inviteCode) {
        String code = inviteCode == null ? "": inviteCode.trim().toUpperCase();

        Course course = courseMapper.findByInviteCode(code);
        if (course == null) {
            throw new BusinessException(404, "邀请码无效或课程不存在");
        }

        CourseMember existing = courseMemberMapper.findByCourseIdAndUserId(course.getId(), userId);
        if (existing != null) {
            throw new BusinessException(409, "你已加入该课程");
        }

        CourseMember member = new CourseMember();
        member.setCourseId(course.getId());
        member.setUserId(userId);
        member.setMemberRole("student");

        courseMemberMapper.upsert(member);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("courseId", course.getId());
        result.put("name", course.getCourseName());
        result.put("semester", course.getSemester());
        result.put("role", "STUDENT");
        result.put("joinedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return result;
    }

    @Override
    public Map<String, Object> getMembers(Long courseId, Long userId) {
        Long teacherId = courseMapper.findTeacherIdByCourseId(courseId);
        if (teacherId == null) {
            throw new BusinessException(404, "课程不存在");
        }
        if (!teacherId.equals(userId)) {
            throw new BusinessException(403, "仅本课程教师可查看成员");
        }

        List<CourseMember> students = courseMemberMapper.findStudentsByCourseId(courseId);

        List<Map<String, Object>> studentList = students.stream()
                .map(s -> Map.<String, Object>of(
                        "userId", s.getUserId(),
                        "name", s.getUserName(),
                        "joinedAt", s.getJoinedAt() != null
                                ? s.getJoinedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                                : null
                ))
                .collect(Collectors.toList());

        return Map.of("students", studentList);
    }

    private String generateInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
            }
            code = sb.toString();
        } while (courseMapper.findByInviteCode(code) != null);
        return code;
    }
}
