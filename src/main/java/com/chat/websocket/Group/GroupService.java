package com.chat.websocket.Group;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository repository;

    public Group createGroup(Group group){
        return repository.save(group);
    }

    public List<Group> findGroupsByUser(String nickname){

        List<Group> groups = repository.findByMembersContaining(nickname);

        System.out.println("Groups for " + nickname + " : " + groups);

        return groups;
    }

    public List<Group> getAllGroups() {
        return repository.findAll();
    }
}