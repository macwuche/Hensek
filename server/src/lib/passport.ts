import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";

export function configurePassport() {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = storage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Invalid email or password" });
          if (user.status === "pending") return done(null, false, { message: "Your account is pending approval" });
          if (user.status === "suspended") return done(null, false, { message: "Your account has been suspended" });

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return done(null, false, { message: "Invalid email or password" });

          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            departmentId: user.departmentId,
            departmentSlug: user.departmentSlug,
            status: user.status,
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: number, done) => {
    const user = storage.getUserById(id);
    if (!user) return done(null, false);
    done(null, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      departmentSlug: user.departmentSlug,
      status: user.status,
    });
  });
}
