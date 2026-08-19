package com.example.smartteachingplatform.mastery.controller;

import com.example.smartteachingplatform.mastery.service.MasteryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mastery")
@RequiredArgsConstructor
public class MasteryController {

    private final MasteryService masteryService;
    // TODO: endpoints
}
