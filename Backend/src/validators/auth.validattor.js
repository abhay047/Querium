import { body, validationResult } from "express-validator";

export function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const registerValidator = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 to 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers and underscores"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .custom((value) => {
            if (value.length < 6) {
                throw new Error("Password should be at least 6 characters long")
            }
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/
            if (!passwordRegex.test(value)) {
                throw new Error("Password should contain at least one uppercase letter and a number")
            }
            return true
        }),

    body("password").isLength({ max: 12 }).withMessage("Password should be less than 12 characters"),
    validate
];

export const loginValidator= [
    body("email").trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email"),

    body("password")
    .notEmpty().withMessage("Password is required"),
    validate
]