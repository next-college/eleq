# EleQ

## Contents

[Note to Contributors](#note-to-contributors)

[Setup](#setup)

[Pull Request Rules](#pull-request-rules)

### Note to Contributors

#### Setup

1. Fork the repository.
2. In your terminal, run the `git clone` command with the forked repository's URL, e.g.

    ``` bash
    git clone https://github.com/JohnDoe/EleQ.git
    ```

    This creates a local repository on your machine.

3. To keep your fork up to date with the development branch of the company's repository, run the following command.

    ```bash
    git config remote.upstream.fetch "+refs/heads/development:refs/remotes/upstream/development" 
    ```

    Now, when you run `git fetch upstream`, Git will only fetch `upstream/development`.

4. If you decide to pull in the updates, then use the following command.

    ``` bash
    git pull upstream development
    ```

    On your next pull, simply use `git pull`. The `development` branch has now been set as the default branch to pull from.

5. Run `git remote -v` to verify. You should see this.

    ``` bash
    origin    https://github.com/JohnDoe/EleQ.git (fetch)
    origin    https://github.com/JohnDoe/EleQ.git (push)
    upstream  https://github.com/next-college/EleQ.git (fetch)
    upstream  https://github.com/next-college/EleQ.git (push)
    ```

    *N/B*: If the origin does not show the forked repository's URL, use the command below to add it and then, run `git remote -v` again to verify.

    ``` bash
    git remote add origin https://github.com/JohnDoe/EleQ.git
    ```

6. Run `npm install` from the root of your project to install already set up dependencies. Cheers! You're all set to go. Well done. 🎉

### Pull Request Rules

For consistent PR pattern that is easy to understand, use the following convention for PR titles: `<type>: <brief description>`. Common types include:

- **feat** — new feature
- **fix** — bug fix
- **docs** — documentation changes
- **refactor** — code restructuring without changing behavior
- **test** — adding or updating tests
- **chore** — maintenance tasks (dependencies, configs)
- **perf** — performance improvements
- **style** — formatting, missing semicolons, etc.

Examples:

- feat: add user authentication with OAuth
- fix: resolve null pointer in checkout flow
- docs: update API documentation for v2 endpoints

In the main description section, provide a clear and concise description of what the PR does. How would you know if your PR is too large? A simple indicator is if you have to add an "and" to the title. What comes after the "and" should definitely be in a separate PR.
