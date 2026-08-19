package com.example.smartteachingplatform.dev.service;

import java.util.Map;

public interface SeedDataService {
    /** 幂等写入全部演示数据，返回摘要信息 */
    Map<String, Object> seed();

    /** 手动触发 Heartbeat（演示用，后续 Agent 对接） */
    Map<String, Object> runHeartbeat(Long courseId);
}
