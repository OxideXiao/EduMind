package com.example.smartteachingplatform.memory.service.impl;

import com.example.smartteachingplatform.memory.entity.StudentMemory;
import com.example.smartteachingplatform.memory.mapper.StudentMemoryMapper;
import com.example.smartteachingplatform.memory.service.MemoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemoryServiceImpl implements MemoryService {

    private final StudentMemoryMapper studentMemoryMapper;

    @Override
    public String get(Long studentId, Long courseId) {
        StudentMemory memory = studentMemoryMapper.findByStudentIdAndCourseId(studentId, courseId);
        return memory != null ? memory.getMemoryJson() : "{}";
    }

    @Override
    public void put(Long studentId, Long courseId, String memoryJson) {
        studentMemoryMapper.upsert(studentId, courseId, memoryJson);
    }
}
