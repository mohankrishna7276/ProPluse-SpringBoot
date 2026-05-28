package com.propulse.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to send messages to clients on prefixes starting with "/topic"
        config.enableSimpleBroker("/topic");
        // Designates the "/app" prefix for messages that are bound for methods annotated with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Standard WebSockets & SockJS fallback endpoints for frontend
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    log.debug("WebSocket Handshake: Extracting authorization headers...");

                    if (authorization != null && !authorization.isEmpty()) {
                        String authHeader = authorization.get(0);
                        if (authHeader.startsWith("Bearer ")) {
                            String jwt = authHeader.substring(7);
                            try {
                                String username = jwtUtils.extractUsername(jwt);
                                if (username != null) {
                                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                    if (jwtUtils.validateToken(jwt, userDetails)) {
                                        UsernamePasswordAuthenticationToken authentication =
                                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                        accessor.setUser(authentication);
                                        log.info("WebSocket handshake successful for user: {}", username);
                                    }
                                }
                            } catch (Exception e) {
                                log.error("WebSocket auth token extraction failed: {}", e.getMessage());
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}
