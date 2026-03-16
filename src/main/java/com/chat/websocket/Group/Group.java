package com.chat.websocket.Group;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "groups")
public class Group {

    @Id
    private String id;

    private String name;

    private List<String> members;

}