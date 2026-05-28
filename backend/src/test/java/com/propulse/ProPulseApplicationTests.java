package com.propulse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class ProPulseApplicationTests {

    @Test
    void contextLoads() {
        // Assert that the Spring application context starts up correctly 
        // with security, sockets, H2, and cache configs in active play.
    }
}
