package com.chat.websocket.GroupChat;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document
public class GroupMessage {

    @Id
    private String id;

    private String groupId;
    private String senderId;
    private String content;
    private Date timestamp;

}