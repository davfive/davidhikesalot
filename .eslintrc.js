module.exports = {
    "ignorePatterns": [
        "build*/",
        "dist/",
        "docs/",
        "**/node_modules/**",
        "**/vendor/**",
        "**/dot/**",
    ],
    "extends": "google",
    "env": { 
        "es6": true,
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 2017
    },
    "rules": {
        "arrow-parens": [ "error", "as-needed" ],
        "eqeqeq": [ "error", "smart" ],
        "linebreak-style": [ "off" ],
        "max-len": [ "error", { "code": 200 } ],
        "new-cap": [ "off" ],
        "no-var": ["error"],
        "operator-linebreak": [ "error", "after", { "overrides": { "?": "before", ":": "before" } } ],
        "require-jsdoc": [ "off" ],
        "semi": ["error", "never"],
        "valid-jsdoc": ["off"],
    }
};