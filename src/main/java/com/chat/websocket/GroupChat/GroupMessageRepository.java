package com.chat.websocket.GroupChat;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface GroupMessageRepository extends MongoRepository<GroupMessage, String> {

    List<GroupMessage> findByGroupId(String groupId);

}