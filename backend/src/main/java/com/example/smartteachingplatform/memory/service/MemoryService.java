package com.example.smartteachingplatform.memory.service;
public interface MemoryService {
    // TODO: get, put
    String get(Long studentId, Long courseId);
    void put(Long studentId, Long courseId, String memoryJson);
}
