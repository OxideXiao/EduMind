package com.example.smartteachingplatform.common.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {

    // TODO: define business error codes
    ;

    private final Integer code;
    private final String message;

    ErrorCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
