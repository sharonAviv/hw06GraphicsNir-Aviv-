# Computer Graphics - Exercise 5 - WebGL Basketball Court

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Complete List of implemented controls
- Arrows -> Move the ball around the court
- ', ד, w, s, W, S -> Strengthens \ weakens the shot
- spacebar -> Throws ball to the closest basket
- O, o -> Toggle Camera

## Description of physics system implementation
The scene runs a lightweight custom physics loop executed once per animation
frame (≈ 60 Hz).  The loop treats the basketball as a point-mass with linear
velocity **v** and position **p** in world-space:

1. **Forces & Integration**  
   * Constant gravity **g = -9.81 m s-²** is applied to **v.y** every frame.  
   * Euler integration updates position: **p ← p + v · Δt**.

2. **Court & Ground Collision**  
   * When **p.y** ≤ ball-radius the ball has touched the floor.  
   * The y-velocity is flipped and damped by a restitution factor
     *`GROUND_RESTITUTION ≈ 0.55`* to simulate energy loss.

3. **Backboard Collision**  
   * A planar backboard equation is pre-computed.  
   * If the signed distance of **p** becomes negative while the ball is moving
     toward the plane, velocity is reflected across the normal and multiplied
     by *`BACKBOARD_RESTITUTION ≈ 0.8`*.

4. **Rim Collision**  
   * Each hoop rim is approximated by a torus: 8 sphere colliders evenly
     distributed around a 0.45 m ring.  
   * For any sphere where **‖p - c‖ < r** and the ball is inbound,
     velocity is reflected; a softer *`RIM_RESTITUTION ≈ 0.3`* makes rim shots
     believable.

5. **Net / Swish Detection**  
   * A shot is a **swish** when the centre of the ball crosses the hoop plane
     with **p.y** below rim-height *and* **never** triggered a rim collider.
   * Swishes grant +1 bonus point and play the “tada” sound.

6. **Hoop Selection & Shooting**  
   * On space-bar, the script picks the nearest hoop centre, calculates the
     required firing direction based on current power (0-100 %), and assigns
     the initial velocity **v₀**.  
   * Air resistance is ignored for arcade feel.

7. **Score Tracking**  
   * When **p.y** drops below rim-height inside the cylinder of either hoop
     the ball is considered scored for that team; combo logic adds bonuses.

8. **Trail Rendering**  
   * A THREE.Line object stores the last *N = 25* positions of the ball and is
     redrawn each frame to create a fading motion trail.

The whole system is fewer than 200 lines yet produces convincing, smooth play
on any device with WebGL support.

## Additional features 
- Multiple Hoops: Allow shooting at both hoops with automatic targeting
- Swish Detection: Bonus points for shots that don't touch the rim
- Combo System: Consecutive shots award bonus points
- Time Challenge: Timed shooting challenges with countdown
- Sound Effects: Audio feedback for bounces and scores
- Ball Trail Effect: Visual trail following the basketball during flight
- Game Modes: Different game modes (free shoot, timed challenge, etc.)
- Leaderboard: High score tracking with local storage

## Tip for easy baskets!
- Go strait left / right from center, a little out of 3pt line, power up shot to 48-51% and shoot!

## Group Members
**MANDATORY: Add the full names of all group members here:**
- Nir Shoham , ID 322657073
- Aviv Sharon , ID 203953039

## Technical Details
- Run the server with: `node index.js`
- Access at http://localhost:8000 in your web browser
