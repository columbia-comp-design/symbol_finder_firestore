var toggler = document.getElementsByClassName("caret");
console.log('toggler')
var i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    console.log('toggler clicked!')
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
  });
}