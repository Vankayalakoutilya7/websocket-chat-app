package com.chat.websocket;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    public String home() {
        return "WebSocket Chat Backend Running 🚀";
    }
}