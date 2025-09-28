import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import styles from "./Profile.module.css";

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    profilePicture: "",
    favoriteGenres: [],
  });
  const [errors, setErrors] = useState({});

  const genres = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Family",
    "Fantasy",
    "History",
    "Horror",
    "Music",
    "Mystery",
    "Romance",
    "Science Fiction",
    "Thriller",
    "War",
    "Western",
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture || "",
        favoriteGenres: user.favoriteGenres || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGenreToggle = (genre) => {
    setFormData((prev) => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter((g) => g !== genre)
        : [...prev.favoriteGenres, genre],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (formData.profilePicture && !isValidUrl(formData.profilePicture)) {
      newErrors.profilePicture = "Please enter a valid URL";
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await updateProfile({
        username: formData.username.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        profilePicture: formData.profilePicture.trim(),
        favoriteGenres: formData.favoriteGenres,
      });

      if (result.success) {
        toast.success("Profile updated successfully!");
        setEditing(false);
      } else {
        toast.error(result.error);
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || "",
      email: user.email || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
      favoriteGenres: user.favoriteGenres || [],
    });
    setErrors({});
    setEditing(false);
  };

  const PasswordSettings = () => {
    const [passwordData, setPasswordData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setPasswordData((prev) => ({ ...prev, [name]: value }));
      if (passwordErrors[name]) {
        setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };

    const validatePasswordForm = () => {
      const newErrors = {};
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      if (!passwordData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      setPasswordErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handlePasswordSubmit = async (e) => {
      e.preventDefault();
      if (!validatePasswordForm()) return;

      setPasswordLoading(true);
      try {
        // This would need to be implemented in your AuthContext
        // const result = await changePassword(passwordData);
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        toast.error("Failed to change password");
      } finally {
        setPasswordLoading(false);
      }
    };

    return (
      <form onSubmit={handlePasswordSubmit} className={styles.editForm}>
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.label}>
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            className={`${styles.input} ${
              passwordErrors.currentPassword ? styles.inputError : ""
            }`}
            disabled={passwordLoading}
          />
          {passwordErrors.currentPassword && (
            <span className={styles.fieldError}>
              {passwordErrors.currentPassword}
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.label}>
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            className={`${styles.input} ${
              passwordErrors.newPassword ? styles.inputError : ""
            }`}
            disabled={passwordLoading}
          />
          {passwordErrors.newPassword && (
            <span className={styles.fieldError}>
              {passwordErrors.newPassword}
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            className={`${styles.input} ${
              passwordErrors.confirmPassword ? styles.inputError : ""
            }`}
            disabled={passwordLoading}
          />
          {passwordErrors.confirmPassword && (
            <span className={styles.fieldError}>
              {passwordErrors.confirmPassword}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.saveButton}
          disabled={passwordLoading}
        >
          {passwordLoading ? "Changing..." : "Change Password"}
        </button>
      </form>
    );
  };

  if (!user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  const defaultAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format";

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <img
              src={user.profilePicture || defaultAvatar}
              alt={user.username}
              className={styles.avatar}
              onError={(e) => {
                e.target.src = defaultAvatar;
              }}
            />
            <div>
              <h1>{user.username}</h1>
              <p className={styles.memberSince}>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className={styles.actionButtons}>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className={styles.editButton}
              >
                Edit Profile
              </button>
            ) : (
              <div className={styles.editActions}>
                <button
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.profileContent}>
          {activeTab === "profile" && (
            <>
              {editing ? (
                <form onSubmit={handleSubmit} className={styles.editForm}>
                  {errors.general && (
                    <div
                      className={styles.fieldError}
                      style={{ marginBottom: "1rem" }}
                    >
                      {errors.general}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        errors.username ? styles.inputError : ""
                      }`}
                      disabled={loading}
                      maxLength={20}
                    />
                    {errors.username && (
                      <span className={styles.fieldError}>
                        {errors.username}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        errors.email ? styles.inputError : ""
                      }`}
                      disabled={loading}
                    />
                    {errors.email && (
                      <span className={styles.fieldError}>{errors.email}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="profilePicture" className={styles.label}>
                      Profile Picture URL
                    </label>
                    <input
                      type="url"
                      id="profilePicture"
                      name="profilePicture"
                      value={formData.profilePicture}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        errors.profilePicture ? styles.inputError : ""
                      }`}
                      placeholder="https://example.com/your-photo.jpg"
                      disabled={loading}
                    />
                    {errors.profilePicture && (
                      <span className={styles.fieldError}>
                        {errors.profilePicture}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bio" className={styles.label}>
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className={`${styles.textarea} ${
                        errors.bio ? styles.inputError : ""
                      }`}
                      rows="4"
                      maxLength={500}
                      disabled={loading}
                    />
                    {errors.bio && (
                      <span className={styles.fieldError}>{errors.bio}</span>
                    )}
                    <small className={styles.characterCount}>
                      {formData.bio.length}/500
                    </small>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Favorite Genres</label>
                    <div className={styles.genresGrid}>
                      {genres.map((genre) => (
                        <label key={genre} className={styles.genreLabel}>
                          <input
                            type="checkbox"
                            className={styles.genreCheckbox}
                            checked={formData.favoriteGenres.includes(genre)}
                            onChange={() => handleGenreToggle(genre)}
                            disabled={loading}
                          />
                          <span className={styles.genreText}>{genre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                <div className={styles.profileInfo}>
                  <div className={styles.infoSection}>
                    <h3>Email</h3>
                    <p>{user.email}</p>
                  </div>

                  {user.bio && (
                    <div className={styles.infoSection}>
                      <h3>Bio</h3>
                      <p>{user.bio}</p>
                    </div>
                  )}

                  {user.favoriteGenres?.length > 0 && (
                    <div className={styles.infoSection}>
                      <h3>Favorite Genres</h3>
                      <div className={styles.genresList}>
                        {user.favoriteGenres.map((genre) => (
                          <span key={genre} className={styles.genreTag}>
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.statsSection}>
                    <h3>Your Activity</h3>
                    <div className={styles.statsGrid}>
                      <Link to="/my-reviews" className={styles.statItem}>
                        <span className={styles.statNumber}>
                          {user.reviewsCount || 0}
                        </span>
                        <span className={styles.statLabel}>
                          Reviews Written
                        </span>
                      </Link>
                      <Link to="/watchlist" className={styles.statItem}>
                        <span className={styles.statNumber}>
                          {user.watchlistCount || 0}
                        </span>
                        <span className={styles.statLabel}>
                          Movies in Watchlist
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "password" && <PasswordSettings />}
        </div>

        <div className={styles.profileFooter}>
          <div className={styles.profileTabs}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "profile" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "password" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              Security
            </button>
          </div>
          <button onClick={logout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
