package com.zjbq.complaint.exception;

import com.zjbq.complaint.vo.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(400, ex.getMessage()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<ApiResponse<Void>> handleValidation(Exception ex) {
        String message = "请求参数不合法";
        if (ex instanceof MethodArgumentNotValidException validException
                && validException.getBindingResult().getFieldError() != null) {
            message = validException.getBindingResult().getFieldError().getDefaultMessage();
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(400, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.fail(500, "服务暂时不可用，请稍后再试"));
    }
}
