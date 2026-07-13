import "./styles/HomePage.css";

function HomePage() {
  const products = [
    {
      id: 1,
      name: "Smart Watch",
      price: "$59.99",
      image: "https://www.ramtrucks.com/content/dam/fca-brands/na/ramtrucks/en_us/2025/ram-1500/gallery/desktop/my25-ram-1500-gallery-open-1-d.jpg.image.1440.jpg",
    },
    {
      id: 2,
      name: "Wireless Headphone",
      price: "$39.99",
      image: "https://via.placeholder.com/300",
    },
    {
      id: 3,
      name: "Laptop Backpack",
      price: "$29.99",
      image: "https://via.placeholder.com/300",
    },
  ];

  const categories = [
    "Electronics",
    "Fashion",
    "Accessories",
    "Home & Living",
  ];

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Shop Everything <br />
            You Need
          </h1>

          <p>
            Discover quality products at the best prices.
            Fast delivery and secure payment.
          </p>

          <button>
            Shop Now
          </button>
        </div>

        <img
          src="https://cdn.searchenginejournal.com/wp-content/uploads/2022/08/google-shopping-ads-6304dccb7a49e-sej-1520x800.png"
          alt="shopping"
          className="hero-image"
        />
      </section>


      {/* Categories */}
      <section className="section">
        <h2>Shop By Category</h2>

        <div className="categories">
          {categories.map((item, index) => (
            <div className="category-card" key={index}>
              <h3>{item}</h3>
              <p>Explore products</p>
            </div>
          ))}
        </div>
      </section>


      {/* Featured Products */}
      <section className="section">
        <h2>Featured Products</h2>

        <div className="products">
          {products.map((product) => (
            <div className="product-card" key={product.id}>

              <img 
                src={product.image}
                alt={product.name}
              />

              <h3>{product.name}</h3>

              <p className="price">
                {product.price}
              </p>

              <button>
                Add To Cart
              </button>

            </div>
          ))}
        </div>
      </section>


      {/* Promotion */}
      <section className="promotion">
        <h2>
          Get 30% Off Your First Order
        </h2>

        <p>
          Register today and enjoy exclusive offers.
        </p>

        <button>
          Create Account
        </button>
      </section>

    </div>
  );
}

export default HomePage;