package com.example.smartteachingplatform.quiz.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

@Data
public class QuestionImportRow {

    @ExcelProperty("题号")
    private String questionCode;

    @ExcelProperty("题型")
    private String type;

    @ExcelProperty("题干")
    private String stem;

    @ExcelProperty("选项")
    private String options;   // A.控制反转|B.垃圾回收

    @ExcelProperty("答案")
    private String answer;

    @ExcelProperty("解析")
    private String analysis;

    @ExcelProperty("难度")
    private Integer difficulty;
}
