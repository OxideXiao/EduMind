package com.example.smartteachingplatform.agent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agent Service (Python) 通用响应包装
 * 格式: { "success": bool, "data": T, "error": "..." }
 */
@Data
@NoArgsConstructor
public class AgentApiResponse<T> {

    private Boolean success;
    private T data;
    private String error;

    public boolean isSuccess() {
        return Boolean.TRUE.equals(success);
    }
}
