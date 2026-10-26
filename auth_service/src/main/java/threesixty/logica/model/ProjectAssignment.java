package threesixty.logica.model;

import javax.persistence.*;

@Entity
@Table(name = "project_assignment")
public class ProjectAssignment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long assignment_id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", referencedColumnName = "userId", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "project_id",referencedColumnName = "id", nullable = false)
	private Project project;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "role_id",referencedColumnName = "id", nullable = false)
	private Role role;

	// Default constructor
	public ProjectAssignment() {}

	// Constructor with parameters
	public ProjectAssignment(User user, Project project, Role role) {
		this.user = user;
		this.project = project;
		this.role = role;
	}

	// Getters and Setters
	public Long getId() {
		return assignment_id;
	}

	public void setId(Long id) {
		this.assignment_id = id;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public Project getProject() {
		return project;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}
}
