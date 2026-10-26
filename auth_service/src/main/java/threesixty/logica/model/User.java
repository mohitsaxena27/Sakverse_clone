package threesixty.logica.model;

import javax.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user")
@Data
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long userId;

	@Column(nullable = false, unique = true)
	private String username;

	@Column(nullable = false)
	private String password;

	@Column(name = "user_display_name")
	private String userDisplayName;

	@Column(name = "role")
	private int role;
	@Column(name = "enabled")
	private boolean enabled;
	@Column(name = "llm_key")
	private String llm_key;

	public void setUsername(String uname) {
		username=uname;
	}

	public void setPassword(String pass) {
		password=pass;
	}

	public void setUserDisplayName(String uDisplayName) {
		userDisplayName=uDisplayName;
	}

	public void setRole(int assingnedrole) {
		role=assingnedrole;
	}

	public void setEnabled(boolean isenabled) {
		enabled=isenabled;
	}

	public void setLlm_key(String llmapiKey) {
		llm_key=llmapiKey;
	}

	public Long getUserId() {
		return userId;
	}
	public String getUsername() {
		return username;
	}

	public String getPassword() {
		return password;
	}

	public String getUserDisplayName() {
		return userDisplayName;
	}

	public int getRole() {
		return role;
	}

	public boolean getEnabled() {
		return enabled;
	}

	public String getLlm_key() {
		return llm_key;
	}
}
