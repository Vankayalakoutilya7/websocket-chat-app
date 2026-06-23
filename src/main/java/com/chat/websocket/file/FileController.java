package com.chat.websocket.file;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class FileController {

    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) throws Exception {

        Path uploadPath = Paths.get("uploads");

        if(!Files.exists(uploadPath)){
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(file.getOriginalFilename());

        Files.write(filePath, file.getBytes());

        return "/uploads/" + file.getOriginalFilename();
    }
}