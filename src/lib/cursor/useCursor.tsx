import {useEffect, useState} from "react";


type MousePosition = {
  x: number
  y: number
}
const useCursor = () => {
  const [position, setPosition] = useState<MousePosition>({x: 0, y: 0})

  useEffect(() => {
    const updateMousePosition = (event: MouseEvent) => {
      setPosition({x: event.clientX, y: event.clientY})
    }

    globalThis.addEventListener("mousemove", updateMousePosition)
    return () => globalThis.removeEventListener("mousemove", updateMousePosition)
  })

  return {position, getMousePosition: () => position}
};

export default useCursor;