package threesixty.logica.model;

import lombok.Data;

import javax.persistence.*;

@Entity
@Table(name = "integration_credentials")
@Data
public class IntegrationCredentials {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String username;
	private String password;

	@ManyToOne
	@JoinColumn(name = "integration_id", nullable = false)
	private Project_integartion integration;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne
	@JoinColumn(name = "project_id", nullable = false)
	private Project project;

	public void setUsername(String uname) {
		username=uname;
	}

	public void setPassword(String pass) {
		password=pass;
	}

	public String getUsername() {
		return username;
	}

	public String getPassword() {
		return password;
	}

	public void setuser_id(User uid) {
		user=uid;
	}
	public User getuser_id() {
		return user;
	}
	public void setproject_id(Project pid) {project=pid;
	}
	public Project getproject_id() {
		return project;
	}
	public void setintegration_id(Project_integartion pid) {integration=pid;
	}
	public Project_integartion getintegration_id() {
		return integration;
	}
}
