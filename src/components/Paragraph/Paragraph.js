import React from 'react';
import PropTypes from 'prop-types';

// Styling
import styles from './Paragraph.module.scss';

// Components
import Heading from '../Heading';

const Paragraph = ({ description, heading, image: { position, url, dataUrl }, colorMode }) => (
    <section className={`${styles.paragraph} ${styles[colorMode]} ${styles[position]}`}>
        {url !== "" &&
            <img
                src={url}
                alt=""
            />
        }
        <div className={styles.textContainer}>
            {heading !== "" &&
                <div className={styles.headingContainer}>
                    <Heading type="quatenary" colorMode={colorMode}>
                        {heading}
                    </Heading>
                </div>
            }
            {description !== "" &&
                <p>
                    {description}
                </p>
            }
        </div>
    </section >
)

Paragraph.propTypes = {
    description: PropTypes.string.isRequired,
    heading: PropTypes.string,
    image: PropTypes.exact({
        position: PropTypes.string,
        url: PropTypes.string,
        dataUrl: PropTypes.any
    }),
    colorMode: PropTypes.oneOf(["light", "dark"])
}

Paragraph.defaultProps = {
    description: "",
    heading: "",
    image: {
        position: "",
        url: "",
        dataUrl: undefined
    }
}

export default Paragraph;