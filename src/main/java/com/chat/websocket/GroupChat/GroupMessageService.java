package com.chat.websocket.GroupChat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupMessageService {

    private final GroupMessageRepository repository;

    public GroupMessage save(GroupMessage message){
        return repository.save(message);
    }

    public List<GroupMessage> findGroupMessages(String groupId){
        return repository.findByGroupId(groupId);
    }
}