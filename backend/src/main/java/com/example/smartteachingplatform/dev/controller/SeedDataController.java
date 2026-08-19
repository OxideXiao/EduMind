package com.example.smartteachingplatform.dev.controller;

import com.example.smartteachingplatform.common.response.Result;
import com.example.smartteachingplatform.dev.service.SeedDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dev")
@Profile("dev")
@RequiredArgsConstructor
public class SeedDataController {

    private final SeedDataService seedDataService;

    /** 幂等写入全部演示数据 */
    @PostMapping("/seed")
    public Result<Map<String, Object>> seed() {
        return Result.success(seedDataService.seed());
    }

    /** 手动触发 Heartbeat（演示用） */
    @PostMapping("/heartbeat/run")
    public Result<Map<String, Object>> runHeartbeat(@RequestParam(defaultValue = "1") Long courseId) {
        return Result.success(seedDataService.runHeartbeat(courseId));
    }
}
