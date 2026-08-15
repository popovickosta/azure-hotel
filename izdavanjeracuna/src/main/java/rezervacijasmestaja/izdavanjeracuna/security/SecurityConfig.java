package rezervacijasmestaja.izdavanjeracuna.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/sobe/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/drzave/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/usluge/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/rezervacije/slobodna").permitAll()

                .requestMatchers(HttpMethod.POST, "/api/sobe/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/sobe/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/sobe/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/usluge/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/usluge/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/usluge/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/drzave/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/drzave/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/drzave/**").hasRole("ADMIN")

                .requestMatchers("/api/admini/**").hasRole("ADMIN")
                .requestMatchers("/api/zaposleni/**").hasRole("ADMIN")
                .requestMatchers("/api/gosti/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/rezervacije").hasRole("GOST")
                .requestMatchers(HttpMethod.GET, "/api/rezervacije/moje", "/api/rezervacije/moje/paginirano").hasRole("GOST")
                .requestMatchers(HttpMethod.PUT, "/api/rezervacije/*/otkazi").hasRole("GOST")
                .requestMatchers(HttpMethod.PUT, "/api/rezervacije/*/status").hasAnyRole("ADMIN", "ZAPOSLENI")
                .requestMatchers("/api/rezervacije/**").hasAnyRole("ADMIN", "ZAPOSLENI")

                .requestMatchers(HttpMethod.GET, "/api/racuni/rezervacija/*", "/api/racuni/*/pdf")
                    .hasAnyRole("GOST", "ADMIN", "ZAPOSLENI")
                .requestMatchers(HttpMethod.DELETE, "/api/racuni/**").hasRole("ADMIN")
                .requestMatchers("/api/racuni/**").hasAnyRole("ADMIN", "ZAPOSLENI")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
