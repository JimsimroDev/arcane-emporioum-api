package uk.jimsimrodev.arcanemporiumapi.infra.email;

public interface IEmailService {
    public void resetPassword(String recipient, String token);
}
