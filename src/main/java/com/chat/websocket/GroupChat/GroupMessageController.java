package com.chat.websocket.GroupChat;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class GroupMessageController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GroupMessageService groupMessageService;

    /**
     * Send message to a group (WebSocket)
     */
    @MessageMapping("/group.chat")
    public void sendGroupMessage(@Payload GroupMessage message) {

        GroupMessage savedMessage = groupMessageService.save(message);

        messagingTemplate.convertAndSend(
                "/topic/group/" + message.getGroupId(),
                savedMessage
        );
    }

    /**
     * Fetch chat history for a group
     */
    @GetMapping("/group/messages/{groupId}")
    public ResponseEntity<List<GroupMessage>> getGroupMessages(@PathVariable String groupId) {

        return ResponseEntity.ok(groupMessageService.findGroupMessages(groupId));
    }
}