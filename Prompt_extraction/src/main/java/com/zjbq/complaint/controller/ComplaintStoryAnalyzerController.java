package com.zjbq.complaint.controller;

import com.zjbq.complaint.dto.AnalyzeStoryRequest;
import com.zjbq.complaint.service.ComplaintStoryAnalyzerService;
import com.zjbq.complaint.vo.AnalyzeStoryResponse;
import com.zjbq.complaint.vo.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/story")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ComplaintStoryAnalyzerController {

    private final ComplaintStoryAnalyzerService analyzerService;

    @PostMapping("/analyze")
    public ApiResponse<AnalyzeStoryResponse> analyze(@Valid @RequestBody AnalyzeStoryRequest request) {
        AnalyzeStoryResponse response = analyzerService.analyze(request);
        return ApiResponse.success("analyze success", response);
    }
}
