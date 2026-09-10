package com.example.smartteachingplatform.graph.dto;

import lombok.Data;

@Data
public class EdgeRequest {
    private String fromCode;
    private String toCode;
    private String relationType;
}
