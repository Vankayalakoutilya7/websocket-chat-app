package com.chat.websocket.Group;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GroupRepository extends MongoRepository<Group,String> {

    List<Group> findByMembersContaining(String nickname);

}