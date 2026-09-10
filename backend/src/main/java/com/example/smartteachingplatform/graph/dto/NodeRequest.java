package com.example.smartteachingplatform.graph.dto;

import lombok.Data;

@Data
public class NodeRequest {
    private String nodeCode;
    private String name;
    private String description;
    private Integer difficulty;
    private String parentCode;
    private Integer sortOrder;
}
