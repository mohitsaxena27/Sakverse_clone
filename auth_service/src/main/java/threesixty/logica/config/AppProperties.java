package threesixty.logica.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppProperties {

    @Value("${thirdparty.api.url}")
    private String thirdPartyApiUrl;

    public String getThirdPartyApiUrl() {
        return thirdPartyApiUrl;
    }
}
