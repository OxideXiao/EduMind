package com.example.smartteachingplatform.memory.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.memory.dto.MemoryGetResponse;
import com.example.smartteachingplatform.memory.dto.MemorySetRequest;
import com.example.smartteachingplatform.memory.service.MemoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;

    /**
     * Agent 读取学生记忆。通过 X-Internal-Token 认证，前端不可直接调用。
     */
    @GetMapping("/{studentId}/memory")
    public Result<MemoryGetResponse> getMemory(@PathVariable Long studentId,
                                                @RequestParam("course_id") Long courseId) {
        String memoryJson = memoryService.get(studentId, courseId);
        return Result.success(new MemoryGetResponse(memoryJson));
    }

    /**
     * Agent 更新学生记忆。通过 X-Internal-Token 认证，前端不可直接调用。
     */
    @PutMapping("/{studentId}/memory")
    public Result<Void> putMemory(@PathVariable Long studentId,
                                   @RequestParam("course_id") Long courseId,
                                   @Valid @RequestBody MemorySetRequest request) {
        memoryService.put(studentId, courseId, request.getMemoryJson());
        return Result.success();
    }
}
