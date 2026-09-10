package com.example.smartteachingplatform.assignment.mapper;

import com.example.smartteachingplatform.assignment.entity.AssignmentSubmission;
import com.example.smartteachingplatform.assignment.entity.SubmissionFile;
import org.apache.ibatis.annotations.*;

@Mapper
public interface AssignmentSubmissionMapper {

    @Select("SELECT * FROM assignment_submissions WHERE assignment_id = #{assignmentId} AND student_id =" +
            "#{studentId}")
    AssignmentSubmission findByAssignmentAndStudent(@Param("assignmentId") Long assignmentId,
                                                    @Param("studentId") Long studentId);

    @Insert("INSERT INTO assignment_submissions (assignment_id, student_id, content, status, submitted_at) " +
            "VALUES (#{assignmentId}, #{studentId}, #{content}, 'submitted', NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AssignmentSubmission submission);

    @Update("UPDATE assignment_submissions SET content = #{content}, status = 'submitted', " +
            "score = NULL, feedback = NULL, submitted_at = NOW(), graded_at = NULL WHERE id = #{id}")
    int updateContent(@Param("id") Long id, @Param("content") String content);

    @Insert("INSERT INTO submission_files (submission_id, file_name, file_url, file_size, created_at) " +
            "VALUES (#{submissionId}, #{fileName}, #{fileUrl}, #{fileSize}, NOW())")
    int insertFile(SubmissionFile file);

    @Delete("DELETE FROM submission_files WHERE submission_id = #{submissionId}")
    int deleteFiles(Long submissionId);
}
