import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";

import { getShare } from "../../services/share/getShare";
import { getMoments } from "../../services/moment/getMoments";

import styles from "./SharedStory.module.css";

function SharedStory() {

  const { shareCode } = useParams();

  const [story, setStory] = useState(null);

  const [moments, setMoments] = useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function load() {

      try {

        const shared =
          await getShare(
            shareCode
          );

        setStory(
          shared.stories
        );

        const data =
          await getMoments(
            shared.story_id
          );

        setMoments(
          data || []
        );

      }

      catch(err){

        console.error(err);

      }

      finally{

        setLoading(false);

      }

    }

    load();

  }, [shareCode]);

  if(loading){

    return <h2>Loading...</h2>;

  }

  if(!story){

    return <h2>Story not found.</h2>;

  }

  return (

    <PageLayout>

      <Container>

        <div className={styles.hero}>

          <h1>

            ❤️ {story.title}

          </h1>

          <p>

            Shared with Momentry

          </p>

        </div>

        <div className={styles.timeline}>

          {moments.map(moment=>(

            <div
              key={moment.id}
              className={styles.card}
            >

              {moment.image_url &&(

                <img
                  src={moment.image_url}
                  alt={moment.title}
                />

              )}

              <h2>

                {moment.title}

              </h2>

              <p>

                {moment.description}

              </p>

              <span>

                {new Date(
                  moment.memory_date
                ).toLocaleDateString()}

              </span>

            </div>

          ))}

        </div>

      </Container>

    </PageLayout>

  );

}

export default SharedStory;