#!/bin/sh
# Locate node via common version manager paths and start the Vite dev server

# Try nvm
for d in "$HOME/.nvm/versions/node"/*/bin; do
  [ -x "$d/node" ] && export PATH="$d:$PATH" && break
done

# Try volta
[ -d "$HOME/.volta/bin" ] && export PATH="$HOME/.volta/bin:$PATH"

# Try asdf
[ -d "$HOME/.asdf/shims" ] && export PATH="$HOME/.asdf/shims:$PATH"

# Try homebrew (Apple Silicon + Intel)
[ -d "/opt/homebrew/bin" ] && export PATH="/opt/homebrew/bin:$PATH"
[ -d "/usr/local/bin" ] && export PATH="/usr/local/bin:$PATH"

# Try fnm
[ -d "$HOME/.fnm" ] && export PATH="$HOME/.fnm:$PATH"
[ -d "$HOME/Library/Application Support/fnm" ] && \
  export PATH="$HOME/Library/Application Support/fnm:$PATH"

# Try n
[ -d "$HOME/.n/bin" ] && export PATH="$HOME/.n/bin:$PATH"
[ -d "/usr/local/n/versions" ] && \
  for d in /usr/local/n/versions/node/*/bin; do
    [ -x "$d/node" ] && export PATH="$d:$PATH" && break
  done

exec node node_modules/.bin/vite --host
