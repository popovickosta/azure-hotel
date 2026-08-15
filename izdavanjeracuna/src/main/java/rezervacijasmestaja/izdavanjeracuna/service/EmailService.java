package rezervacijasmestaja.izdavanjeracuna.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.backend-url}")
    private String backendUrl;

    public void posaljiVerifikacioniEmail(String email, String ime, String token) {
        try {
            MimeMessage poruka = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(poruka, "UTF-8");

            helper.setFrom("noreply@rezervacijasmestaja.com");
            helper.setTo(email);
            helper.setSubject("Potvrdite registraciju - Azure Hotel");

            String verificationUrl = backendUrl + "/api/auth/verify?token=" + token;

            String htmlSadrzaj = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
                    <h1 style="color: #2c3e50;">Dobrodošli, %s!</h1>
                    <p style="font-size: 16px; color: #444;">
                        Hvala vam na registraciji u <strong>Azure Hotel</strong> sistemu.
                        Potrebno je da potvrdite email adresu pre prve prijave.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #2c3e50; color: #ffffff; padding: 12px 28px;
                           text-decoration: none; border-radius: 5px; font-size: 16px;">
                            Potvrdi email
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #888;">
                        Link važi 24 sata. Ako niste napravili ovaj nalog, zanemarite poruku.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa; text-align: center;">
                        © 2026 Azure Hotel. Sva prava zadržana.
                    </p>
                </div>
                """.formatted(ime, verificationUrl);

            helper.setText(htmlSadrzaj, true);
            mailSender.send(poruka);
        } catch (Exception e) {
            throw new RuntimeException("Greška prilikom slanja verifikacionog mejla", e);
        }
    }
}
