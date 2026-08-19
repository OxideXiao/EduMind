package com.example.smartteachingplatform.course.service.impl;

import com.example.smartteachingplatform.common.exception.BusinessException;
import com.example.smartteachingplatform.course.entity.Course;
import com.example.smartteachingplatform.course.entity.CourseMember;
import com.example.smartteachingplatform.course.mapper.CourseMapper;
import com.example.smartteachingplatform.course.mapper.CourseMemberMapper;
import com.example.smartteachingplatform.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
                .map(c -> Map.<String, Object>of(
                        "courseId", c.getId(),
                        "name", c.getCourseName(),
                        "semester", c.getSemester(),
                        "role", c.getRole().toUpperCase(),
                        "memberCount", c.getMemberCount() != null ? c.getMemberCount() : 0,
                        "studentCount", c.getStudentCount() != null ? c.getStudentCount() : 0,
                        "nodeCount", c.getNodeCount() != null ? c.getNodeCount() : 0
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> joinByInviteCode(Long userId, Long courseId, String inviteCode) {
        Course course = courseMapper.findByInviteCode(inviteCode);
        if (course == null || !course.getId().equals(courseId)) {
            throw new BusinessException(400, "邀请码无效或课程不匹配");
        }

        CourseMember existing = courseMemberMapper.findByCourseIdAndUserId(courseId, userId);
        if (existing != null) {
            throw new BusinessException(400, "你已加入该课程");
        }

        CourseMember member = new CourseMember();
        member.setCourseId(courseId);
        member.setUserId(userId);
        member.setMemberRole("student");

        try {
            courseMemberMapper.insert(member);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(400, "你已加入该课程");
        }

        return Map.of(
                "courseId", courseId,
                "joinedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
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
