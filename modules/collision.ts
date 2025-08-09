export function do_rect_and_circle_collide(circle_x: number, circle_y: number, circle_radius: number, rect_x: number, rect_y: number, rect_width: number, rect_height: number): boolean {
    const square_center_x = rect_x + rect_width / 2;
    const square_center_y = rect_y + rect_height / 2;

    circle_x -= square_center_x;
    circle_y -= square_center_y;

    circle_x = Math.abs(circle_x);
    circle_y = Math.abs(circle_y);

    //circle center is inside rect
    if(circle_x < rect_width / 2 && circle_y < rect_height / 2) {
	return true;
    }

    //circle is above square and radius touches the square top
    if(circle_x < rect_width / 2 && circle_y <= circle_radius + rect_height / 2) {
	return true;
    }

    //circle is beside square and radius touches the right edge
    if(circle_y < rect_height / 2 && circle_x <= circle_radius + rect_width / 2) {
	return true;
    }

    //circle must be neither beside or above the square so we check the distance between the top left corner and the circle center
    if(Math.sqrt(Math.pow(circle_x - rect_width / 2, 2) + Math.pow(circle_y - rect_height / 2, 2)) <= circle_radius) {
	return true;
    }

    return false;
}
