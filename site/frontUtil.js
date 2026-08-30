export function green(div){
    div.classList.remove("red");
    div.classList.add("green");
}
export function red(div){
    div.classList.add("red");
    div.classList.remove("green");
}
export function black(div){
    div.classList.remove("red");
    div.classList.remove("green");
}