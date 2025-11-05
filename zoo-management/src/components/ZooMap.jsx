import zooMapImage from "../assets/zoo-map.png";

export function ZooMap() {
  return (
    <div className="bg-white rounded-lg p-8 border-2 border-green-200">
      <div className="w-full max-w-4xl mx-auto">
        <img
          src={zooMapImage}
          alt="WildWood Zoo Map"
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
}
