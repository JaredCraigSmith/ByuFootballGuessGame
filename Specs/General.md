# Description
This is a guess the score game for BYU football games for my family and friends only.  It should allow accounts to be made that can have multiple players which typically will be their other family members.  A lot of the kids don't have access to the internet so the parents just fill it out for them.  It should be easy for user to view who won each week and who is the overall leader.  I want the Ui to be fun with gifs and emojis.  The leader board should show who dropped and by how much and who moved up and by how much.  It should show a fire emoji if someone is on fire or other emojis for other situations.  There should be a count down to kick off timer for each game coming up. The main page after the login will probably be the leader board page.  There should be an indicator for how many guesses have been filed out for the upcoming game.  So it would say something like 5/10 players have made their guesses for the upcoming game, so they know they might need to get that filled out still.  When making guesses it should be easy to see all the players on your account and fill them all out in one view, also make this the add player view to keep fewer views.  And just to be clear all players across all account are competing against another and show on the leader board.  When creating a player have them select a name and color, the color should show up on their leader board entry.  

# Score Algorithm
To determine each player's score.  It should be how far away their guess was from the actual.  The closer they are the higher the score.  To keep people playing drop their 2 lowest scores unless we are at the beginning of the season 3 game drop lowest 4 game drop 2 lowest and then 5 game 2 lowest.  I also want game further in the season to be worth more points so someone can always come back and win it but not so much that the first games score make not difference. 

# Security
This is just for fun, so I'm not worried about getting hacked. I used just a simple pin to prevent maybe some cousins from being silly and messing with others guesses.  But I want it to be simple enough that they forget their password and stop playing. 

# Admin
If the account name is "J&J Smith's" then they are the admin and can input what the actual score of the game are. 

# Technical details
This will be a site hosted on github pages and use supabase as the database. It should be designed for a phone to view.  I don't want to use up my database usage so try to cache and do thing in the app as much as possible.  I also don't want to cache too much and cause the user to always see outdated info.  


# Login Screen
I'm thinking the login account name input should even be a drop down with known account so its easier to remember and just input a pin.

# Style
BYU football fan fair.  If you can add random easter eggs like click something and cosmo dances on the screen.  But don't make them hard to find. 