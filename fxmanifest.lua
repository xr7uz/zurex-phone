fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'zurex-phone'
author 'Zurex'
description 'Zurex XR7 phone: 216 apps, social, trading, games, services. QBCore / Qbox / ESX / standalone.'
version '2.0.0'
repository 'https://github.com/xr7uz/zurex-phone'

shared_script 'config.lua'

client_scripts {
  'client/main.lua',
}

server_scripts {
  'server/bridge.lua',
  'server/store.lua',
  'server/market.lua',
  'server/main.lua',
}

ui_page 'html/index.html'

files {
  'html/index.html',
  'html/*.css',
  'html/js/*.js',
  'html/data/*.js',
  'html/fonts/*.woff2',
}

dependencies {
  '/server:7290',
  '/onesync',
}
