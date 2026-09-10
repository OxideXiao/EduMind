package com.example.smartteachingplatform.graph.dto;

import lombok.Data;

@Data
public class NodeQueryResponse {
    private Long nodeId;
    private String nodeCode;
    private String name;
    private String description;
    private Integer difficulty;
    private Long parentId;
    private String parentCode;
    private Integer sortOrder;
    private String status;
}
