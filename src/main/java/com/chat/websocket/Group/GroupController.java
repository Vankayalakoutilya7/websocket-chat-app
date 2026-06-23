package com.chat.websocket.Group;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Group group){

        Group savedGroup = groupService.createGroup(group);

        // notify clients
        messagingTemplate.convertAndSend("/topic/groups", savedGroup);

        return ResponseEntity.ok(savedGroup);
    }

    @GetMapping("/{nickname}")
    public ResponseEntity<List<Group>> getUserGroups(@PathVariable String nickname){
        return ResponseEntity.ok(groupService.findGroupsByUser(nickname));
    }
}