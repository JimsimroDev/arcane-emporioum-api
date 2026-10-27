package uk.jimsimrodev.arcanemporiumapi.infra.email.dto;

import java.util.List;

public record MailRequesDto(
        String htmlContent,
        SenderDto sender,
        String subject,
        List<ToDto> to) {
}
